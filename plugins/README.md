# Plugins

Plugins allow you to modify instamancer's functionality and behavior while gathering data.

The following internal plugins are included with instamancer (but not enabled by default):

|Plugin    |Description                                                        |
|----------|-------------------------------------------------------------------|
|LargeFirst|Increase the `first` parameter in API requests to ask for more data|

## Using plugins with the CLI

Example:

``` 
instamancer hashtag puppies -c1000 --plugin LargeFirst --plugin MyPlugin
```

## Using external plugins with the CLI

To install external plugins, you need to clone and install instamancer from source

Steps:

1. Clone the instamancer repository
2. Install instamancer's dependencies
3. Install the plugin with npm / yarn
4. Add the plugin to `plugins/plugins/index.ts` 

    Example:
    

``` typescript
   export { MyPlugin } from "myplugin";
   ```

5. Install instamancer 
    1. You can skip this step if you want to run the CLI from source
6. Run the CLI with the plugin:

    
    Example:
    

``` 
   instamancer hashtag puppies -c100 --plugin MyPlugin
   ```

## Using plugins with the module

Add the plugin to the `options` :

``` typescript
import * as instamancer from ".";

const options: instamancer.IOptions = {
    plugins: [new instamancer.plugins.LargeFirst()],
    silent: true,
    total: 100,
};
const hashtag = instamancer.createApi("hashtag", "puppies", options);

(async () => {
    for await (const post of hashtag.generator()) {
        console.log(post);
    }
})();

```
