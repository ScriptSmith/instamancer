import {writeFileSync} from "fs";
import {dirname, join} from "path";
import transform from "transform-json-types";
import * as json from "./input.json";

const getPath = () => join(dirname(__filename), "./output.ts");

let output = transform(json, {
  lang: "io-ts",
});

output = `import * as t from "io-ts";\n\n${output}`;
output = output.replace(/^const/gm, "export const");
output = output.replace(/\ string/gm, " t.string");
output = output.replace(/t\.Integer/gm, "t.number");

writeFileSync(getPath(), output, {
  encoding: "utf-8",
});
