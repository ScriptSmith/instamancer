import {Hashtag, IOptions} from "../../src/api/api";

export class QuickGraft extends Hashtag<{}> {
    constructor(id: string, options: IOptions = {}) {
        super(id, options);
        this.jumpMod = 2;
    }
}
