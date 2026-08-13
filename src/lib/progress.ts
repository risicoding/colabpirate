import progress from "cli-progress";
import { formatBytes } from "./utils.js";

export const createMutibar = (type: "download" | "upload") => {
  const multibar = new progress.MultiBar(
    {
      format: `${type} |{bar}| {percentage}% | {value}/{total} | {eta}s`,
      formatValue: (value, _, type) => {
        if (type === "value" || type === "total") {
          const format = formatBytes(value);
          return `${format.value}${format.unit}`;
        }
        return value.toString();
      },
    },
    progress.Presets.rect,
  );

  return multibar;
};

export const createSingleBar = () => {
  return new progress.SingleBar(
    {
      format: `| {bar} | {percentage}% | {value}/{total} | {speed}/s | {eta}s`,
      formatValue: (value, _, type) => {
        if (type === "value" || type === "total") {
          const format = formatBytes(value);
          return `${format.value}${format.unit}`;
        }
        return value.toString();
      },
    },
    progress.Presets.rect,
  );
};

export class Bar {
  private filled = "█";
  private empty = "░";
  constructor(
    public size: number,
    public name: string,
    public type: "download" | "upload",
    public value = 0,
  ) {}
  public update = (value: number) => {
    this.value = value;
    let name = this.name;
    if (name.length > 5) {
      name = name.slice(0, 5) + "...";
    }

    const progress = this.progress();
    const done = formatBytes(this.value);
    const size = formatBytes(this.size);
    if (Math.random() < 0.2) {
      console.log(
        `${this.type} ${name} ${progress} ${done.value + done.unit}/${size.value + size.unit}`,
      );

      return;
    }
    return;
  };

  private progress = () => {
    const barLength = 40;
    const progressValue = Math.floor((this.value / this.size) * barLength);
    const filled = Array.from(
      { length: progressValue },
      () => this.filled,
    ).join("");
    const empty = Array.from(
      { length: barLength - progressValue },
      () => this.empty,
    ).join("");
    return `${filled}${empty}`;
  };
}

// function main() {
//   const multibar = createMutibar();
//
//   Array.from(
//     { length: 13 },
//     (_, i) => 1024 ** i * (Math.floor(Math.random() * (1023 - 10 + 1)) + 1023),
//   ).forEach((v, i) => {
//     const bar = multibar.create(v, 0);
//     bar.start(v, 0);
//
//     let j = 1;
//     setInterval(
//       () => {
//         if (j > v) {
//           return;
//         }
//         bar.update(j);
//         j +=
//           Math.floor(Math.random() * (1024 ** i - 1024 ** (i - 1) + 1)) +
//           1024 ** (i - 1);
//       },
//       Math.floor(Math.random() * (1000 - 200 + 1) + 200),
//     );
//   });
// }
//
// main();
