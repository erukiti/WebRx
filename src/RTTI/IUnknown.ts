module wx {
    "use strict";

    /// <summary>
    /// In absence of usable runtime-type-information in Typescript, good ole' IUnknown is making a comeback
    /// </summary>
    export interface IUnknown {
        queryInterface(iid: string): boolean;
    }
}