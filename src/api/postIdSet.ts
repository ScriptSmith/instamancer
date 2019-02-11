/**
 * A set of post ids used to detect duplicates
 */
export class PostIdSet {
    private ids: Set<string> = new Set<string>();

    /**
     * Add a post id to the set.
     * @return true if the id was already in the set, false if not.
     */
    public add(id: string): boolean {
        const contains = this.ids.has(id);
        this.ids.add(id);
        return contains;
    }
}
