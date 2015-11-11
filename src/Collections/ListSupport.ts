/// <reference path="../Interfaces.ts" />

import { ObservableList } from "./List"
import { PagedObservableListProjection } from "./ListPaged"

"use strict";

/**
* Determines if target is an instance of a IObservableList
* @param {any} target
*/
export function isList(target: any): boolean {
    if (target == null)
        return false;

    return target instanceof ObservableList ||
        target instanceof PagedObservableListProjection;
}
