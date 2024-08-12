import axios from 'axios';
import { exec } from 'child_process';
import { isTypedArray } from 'util/types';

export type TeslaProduct = SolarProduct | CarProduct;

export interface TeslaInterface {
    getProducts(): Promise<TeslaProduct[]>;
    getLiveEnergy(): Promise<LiveStatus>;
    getCarChargingSettings(vin: string): Promise<CarChargingData>;
    setAmps(vin: string, amps: number): Promise<void>;
}

export enum ProductType {
    CAR,
    SOLAR,
    POWERWALL
}

export interface SolarProduct {
    energy_site_id: string;
}
export interface CarProduct {
    vin: string;
}

export interface LiveStatus {
    solar_power: number;
    grid_power: number;
    load_power: number;
    timestamp: string; // TODO: convert to Date
}

export interface CarChargingData {
    vin: string;
    charge_state: {
        battery_level: number;
        charge_amps: number;
        charge_limit_soc: number;
        charger_actual_current: number;
        charger_voltage: number;
    }
}

export interface TeslaAPIMe {
    email: string;
    full_name: string;
    profile_image_url: string;
}

export class Tesla implements TeslaInterface {
    private accessToken: string;
    private teslaAPIURL: string = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1'

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async runGetRequest(path: string) {
        try {
            const resp = await axios.get(`${this.teslaAPIURL}${path}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('HTTP Error Code:', error.response?.status);
                console.error('Raw Response:', error.response?.data);
            } else {
                console.error('Error:', error);
            }

        }
    }

    private async runPostRequest(path: string, data?: Record<string, any>) {
        try {
            const resp = await axios.post(`${this.teslaAPIURL}/${path}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }, data
            });
            console.log(resp);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('HTTP Error Code:', error.response?.status);
                console.error('Raw Response:', error.response?.data);
            } else {
                console.error('Error:', error);
            }

        }
    }

    async getProducts(): Promise<TeslaProduct[]> {
        return (await this.runGetRequest('/products')).response;
    }

    // TODO: get rid of resp?.response stuff

    async getLiveEnergy(): Promise<LiveStatus> {
        // NOT STE20240711-01102
        // NOT 3f255c6c-8a90-4866-87cf-70450106d788
        // 3910ba5e-544f-4d5c-8748-403bd351da57
        const resp = await this.runGetRequest(`/energy_sites/2252343410972774/live_status`);
        return resp?.response;
    }

    async getCarChargingSettings(vin: string): Promise<CarChargingData> {
        const resp = await this.runGetRequest(`/vehicles/${vin}/vehicle_data`);
        return resp?.response;
    }

    async setAmps(vin: string, amps: number): Promise<void> {


        const command = `./send-command.sh ${this.accessToken} ${vin} ${amps}`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
          }
      
          if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
          }
      
          console.log(`Output: ${stdout}`);
        });

        /*
        const resp = await this.runPostRequest(`/vehicles/${vin}/command/set_charging_amps`, {
            charging_amps: amps
        });
        console.log(resp.data);
        await this.startCharge(vin);
        */
    }

    private async startCharge(vin: string): Promise<void> {
        const resp = await this.runPostRequest(`/vehicles/${vin}/command/charge_start`);
        console.log(resp.data);
    }

    async getMe(): Promise<TeslaAPIMe> {
        const resp = await this.runGetRequest(`/users/me`);
        return resp?.response;
    }
}