import * as json from "./input.json";
import transform from "transform-json-types"
import { writeFileSync } from "fs";
import { join, dirname } from "path";

const getPath = () => join(dirname(__filename), "./output.ts");

let output = transform(json, {
  lang: "io-ts"
});

output = `import * as t from "io-ts";\n\n${output}`;
output = output.replace(/^const/gm, "var");

writeFileSync(getPath(), output, {
  encoding: 'utf-8',
});
