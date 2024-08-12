import { UserDbModel } from "./database.js";
import { TeslaInterface } from "./tesla-api.js";
import { UserPreferences } from "./user.js";

export class ThrottleLoop {

    private tesla: TeslaInterface;
    private userPreference: UserPreferences;
    private user: UserDbModel;

    constructor(tesla: TeslaInterface, user: UserDbModel) {
        this.tesla = tesla;
        this.userPreference = {
            consumptionOffset: 300
        }
        this.user = user;
    }

    public async throttleCar(): Promise<void> {
        console.log("Throttling..");
        const liveStatus = await this.tesla.getLiveEnergy();
        if (!liveStatus) {
            return;
        }
        // if positive, we need to reduce usage
        console.log("solar power:", liveStatus.solar_power, "house usage:", liveStatus.load_power);
        const usageError = liveStatus.grid_power - this.userPreference.consumptionOffset;
        const currentCarUsage = await this.tesla.getCarChargingSettings(this.user.carsVins[0]); // todo: remove force unwrap
        if (!currentCarUsage) {
            console.log("Car probly asleep");
            return;
        }
        const charger_volts = currentCarUsage.charge_state.charger_voltage;
        const currentChargeWatt = currentCarUsage.charge_state.charger_actual_current * charger_volts;
        if (currentChargeWatt === 0) {
            console.log("Car charging is off. skip.");
            return;
        }
        /*
        amps = ? // amps is the number of amps desired
        watt = amps * charger_volts
        what is watt? watt is currentChargeWatt - usageError
        */
        let targetAmps = Math.round((currentChargeWatt - usageError) / charger_volts);
        console.log("Current charge watt:", currentChargeWatt, " usage error:", usageError, "charger volts:", charger_volts);
        console.log("Calculated target amps", targetAmps);
        if (targetAmps < 5) {
            targetAmps = 5;
        }
        try {
            console.log("trying to set", targetAmps);
            await this.tesla.setAmps(this.user.carsVins[0], targetAmps);
        } catch {
            console.log("Setting amps didn't work");
        }
    }
}