import { Model } from '../models/model.js';

export class Controller {
    constructor(view) {
        this.model = new Model();
        this.view = view;
    }

    init() {
        this.view.render();
    }
}
