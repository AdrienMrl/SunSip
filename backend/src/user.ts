import { CarProduct, TeslaProduct } from "./tesla-api";

export interface UserPreferences {
    // desired offset for how much energy should the house use in watts
    // e.g. -200w, solar power: 2.4kw, house target use: 2.2kw 
    consumptionOffset: number

}