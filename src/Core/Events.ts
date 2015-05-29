/// <reference path="../Interfaces.ts" />

"use strict";

export class PropertyChangedEventArgs implements
    wx.IPropertyChangedEventArgs {
    /// <summary>
    /// Initializes a new instance of the <see cref="ObservablePropertyChangedEventArgs{TSender}"/> class.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="propertyName">Name of the property.</param>
    constructor(sender: any, propertyName: string) {
        this.propertyName = propertyName;
        this.sender = sender;
    }

    sender: any; //  { get; private set; }
    propertyName: string;
}
