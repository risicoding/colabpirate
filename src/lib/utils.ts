import { err, ok, Result } from "neverthrow";
import { AppError } from "./error.js";

const logbase = (i: number, base: number) => Math.log(i) / Math.log(base);

const storageUnits = [
  { unit: "B", name: "Bytes" },
  { unit: "KiB", name: "Kibibytes" },
  { unit: "MiB", name: "Mebibytes" },
  { unit: "GiB", name: "Gibibytes" },
  { unit: "TiB", name: "Tebibytes" },
  { unit: "PiB", name: "Pebibytes" },
  { unit: "EiB", name: "Exbibytes" },
  { unit: "ZiB", name: "Zebibytes" },
  { unit: "YiB", name: "Yobibytes" },
] as const;

export const formatBytes = (bytes: number) => {
  if (bytes <= 0) return { value: 0, unit: storageUnits[0].unit };
  const pow = Math.max(0, Math.floor(logbase(bytes, 1024)));
  const unitIndex = Math.min(pow, storageUnits.length - 1);

  return {
    value: (bytes / 1024 ** unitIndex).toFixed(2),
    unit: storageUnits[unitIndex]!.unit,
  };
};

class ParsingError extends AppError {}

const testByte = (string: string) => {
  if (/^\d+$/.test(string)) return Number(string);
  return NaN;
};

export const parseString = (
  string: string,
): Result<[number | undefined, number | undefined], ParsingError> => {
  const lowerCaseString = string.toLowerCase();

  if (!lowerCaseString.startsWith("bytes="))
    return err(new ParsingError("invalid range"));

  const bytes = lowerCaseString.split("bytes=")[1]?.split("-");

  if (!bytes || bytes.length !== 2)
    return err(new ParsingError("invalid range"));

  const start = bytes[0] ? testByte(bytes[0]) : undefined;
  const end = bytes[1] ? testByte(bytes[1]) : undefined;

  return ok([start, end]);
};

class ValidationError extends AppError {}
export const validateBytes = (
  [start, end]: [number | undefined, number | undefined],
  size: number,
): Result<[number, number], ValidationError> => {
  /*
   * either Nan=>errorr
   * [undefined,undefined]=> error
   * [undefined,number] => suffix case
   * [number,number]
   * [number,undefined]=> set end to size-1
   */

  const error = err(new ValidationError("invalid range"));
  if (
    (start !== undefined && isNaN(start)) ||
    (end !== undefined && isNaN(end))
  )
    return error;

  if (start === undefined && end === undefined) return error;

  if (start === undefined && end !== undefined && !isNaN(end)) {
    if (end <= 0) return err(new ValidationError("invalid range"));
    start = size - end;
    return ok([start > 0 ? start : 0, size - 1]);
  }

  if (start === undefined) return err(new ValidationError("invalid range"));

  if (end === undefined) end = size - 1;

  if (start >= size || start > end || start < 0 || end < 0) return error;

  const safeEnd = end >= size ? size - 1 : end;

  return ok([start, safeEnd]);
};

export const parseRangeBytes = (
  string: string,
  size: number,
): Result<[number, number], ParsingError> => {
  const bytes = parseString(string);
  if (bytes.isErr()) return err(new ParsingError("invalid range"));

  const res = validateBytes(bytes.value, size);

  if (res.isErr()) return err(new ParsingError("invalid range"));

  return ok(res.value);
};

// export const parseRangeBytes = (
//   string: string,
//   size: number,
// ): Result<[number, number], ParsingError> => {
//   const lowerCaseString = string.toLowerCase();
//
//   if (!lowerCaseString.includes("bytes=")) {
//     return err(new ParsingError("invalid range"));
//   }
//
//   const bytes = lowerCaseString.split("bytes=")[1]?.split("-");
//
//   if (!bytes || bytes.length !== 2)
//     return err(new ParsingError("invalid range"));
//
//   const startStr = bytes[0]; // "h"/"0"/""
//   const endStr = bytes[1]; // "h"/"0"/""
//
//   if (!startStr && !endStr) return err(new ParsingError("invalid range"));
//
//   let startInt = startStr ? parseInt(startStr) : undefined;
//   let endInt = endStr ? parseInt(endStr) : size - 1;
//
//   if (startInt === undefined && !isNaN(endInt)) {
//     if (endInt <= 0) return err(new ParsingError("invalid range"));
//     startInt = size - endInt;
//     return ok([startInt > 0 ? startInt : 0, size - 1]);
//   }
//
//   if (startInt === undefined) return err(new ParsingError("invalid range"));
//
//   if (
//     isNaN(startInt) ||
//     isNaN(endInt) ||
//     startInt < 0 ||
//     endInt < 0 ||
//     startInt > endInt ||
//     startInt >= size
//   )
//     return err(new ParsingError("invalid range"));
//
//   return ok([startInt, endInt >= size ? size - 1 : endInt]);
// };

// function test(string: string) {
//   const res = parseRangeBytes(string, 100);
//   res?.match(
//     (res) => console.log(`${string}: `, res),
//     (e) => console.error(`${string}: `, e),
//   );
// }

// //✅ normal cases
// test("bytes=0-10"); // 🟢 [0, 10]
// test("bytes=5-20"); // 🟢 [5, 20]
// test("bytes=0-99"); // 🟢 [0, 99]
// test("bytes=50-50"); // 🟢 [50, 50]
//
// // ✅ open-ended
// test("bytes=0-"); // 🟢 [0, 99]
// test("bytes=20-"); // 🟢 [20, 99]
//
// // ✅ suffix ranges
// test("bytes=-1"); // 🟢 [99, 99]
// test("bytes=-5"); // 🟢 [95, 99]
// test("bytes=-100"); // 🟢 [0, 99]
// test("bytes=-150"); // 🟢 [0, 99]
//
// // ⚠️ clamp cases
// test("bytes=0-120"); // 🟢 [0, 99]
// test("bytes=90-150"); // 🟢 [90, 99]
//
// // ❌ invalid numeric
// test("bytes=50-10"); // 🔴 error (start > end)
// test("bytes=100-120"); // 🔴 error (start >= size)
// test("bytes=h-10"); // 🔴 error
// test("bytes=10-h"); // 🔴 error
// test("bytes=h-k"); // 🔴 error
//
// // ❌ malformed
// test("bytes="); // 🔴 error
// test(""); // 🔴 error
// test("range=0-10"); // 🔴 error
// test("bytes=-"); // 🔴 error
//
// // ❌ tricky edge goblins 👹
// test("bytes=-0"); // 🔴 error
// test("bytes=0--10"); // 🔴 error
// test("bytes=--10"); // 🔴 error
// test("bytes=-10-20"); // 🔴 error
//
// // ⚠️ casing + spacing
// test("Bytes=0-10"); // 🟢 [0, 10]
// test("BYTES=0-10"); // 🟢 [0, 10]
// test("bytes= 0-10"); // 🟢 [0, 10] (if parseInt tolerates space)
//
// // 🧪 weird but interesting
// test("bytes=000-010"); // 🟢 [0, 10]
// test("bytes=01-0010"); // 🟢 [1, 10]
//
// //
// // test("bytes=0-");
// // test("bytes=0-99");
// // test("bytes=50-50");
// // test("bytes=-5");
// // test("bytes=-500");
// // test("bytes=20-");
// // test("bytes=-0");
// // test("bytes=-20-h");
