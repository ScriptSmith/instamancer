import {writeFileSync} from "fs";
import {dirname, join} from "path";
import transform from "transform-json-types";
// @ts-ignore
import * as json from "./input.json";

const getPath = () => join(dirname(__filename), "./output.ts");

const removeVarFromCode = (code: string, varName: string): string => {
  const regexp = new RegExp(`\nconst ${varName} =[^;]+;\n`, "gm");
  return code.replace(regexp, "");
};

const addTypeToCode = (code: string, typeName: string): string => {
  return `${code}\nexport type T${typeName} = t.TypeOf<typeof ${typeName}>;\n`;
};

const singularizeVarNameInCode = (
  code: string,
  varNameSingle: string,
): string => {
  const regexp = new RegExp(`${varNameSingle}s`, "gm");
  return code.replace(regexp, varNameSingle);
};

let output = transform(json, {
  lang: "io-ts",
});

output = `import * as t from "io-ts";\n\n${output}`;
output = `// tslint:disable: object-literal-sort-keys\n${output}`;
output = `${output}// tslint:enable: object-literal-sort-keys\n`;
output = removeVarFromCode(output, "RootInterface");
output = removeVarFromCode(output, "Default");
output = output.replace(/^const/gm, "export const");
output = output.replace(/t\.Array/gm, "t.UnknownArray");
output = output.replace(/\ string/gm, " t.string"); // Really weird
output = output.replace(/t\.Integer/gm, "t.number"); // Integer does not have ts type
output = singularizeVarNameInCode(output, "Post");
output = singularizeVarNameInCode(output, "SearchResult");
output = addTypeToCode(output, "Post");
output = addTypeToCode(output, "SinglePost");
output = addTypeToCode(output, "SearchResult");

writeFileSync(getPath(), output, {
  encoding: "utf-8",
});
