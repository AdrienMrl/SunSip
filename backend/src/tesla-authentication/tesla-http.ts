import { randomUUID } from 'crypto';
import axios from 'axios';

const teslaAPI = {
    baseOAuthURL: 'https://auth.tesla.com/oauth2/v3',
    scopes: 'user_data openid vehicle_device_data vehicle_charging_cmds energy_device_data vehicle_cmds'
}

export async function requestAuthCode(): Promise<string> {

    // Construct the query string
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.TESLA_CLIENT_ID || '',
        redirect_uri: process.env.REDIRECT_URI || '',
        scope: teslaAPI.scopes,
        state: randomUUID(),
    }).toString();

    // Make the GET request with the query string
    try {
        const response = await axios.get(`${teslaAPI.baseOAuthURL}/authorize?${params}`);
        console.log(response.data);
        return response.data; // or any relevant field from the response
    } catch (error) {
        console.error(JSON.stringify(error));
        throw new Error('Failed to request auth code');
    }
}
//=> {"hello": "world"}