import { requestAuthCode } from "./tesla-authentication/tesla-http.js";
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import axios from "axios";
import dotenv from 'dotenv';
import { CarProduct, ProductType, SolarProduct, Tesla } from "./tesla-api.js";
import { ThrottleLoop } from "./ThrottleLoop.js";
import { makeDatabaseInstance, UserDbModel } from "./database.js";

dotenv.config(); // TODO: might want to move this

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allows all origins
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

// Define types for the request body
interface TeslaAuthRequest {
    code: string;
}

// POST /tesla-auth endpoint
app.post('/tesla-auth', async (req: Request<{}, {}, TeslaAuthRequest>, res: Response) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).send({ error: 'Missing code' });
    }

    console.log(code);

    await requestAuthenticationToken(code);

    res.send({ message: 'Received code! Thanks u' });
});

let users: UserDbModel[] = [];

async function requestAuthenticationToken(code: string) {
    
    const requestBody = new URLSearchParams();
    requestBody.append('grant_type', 'authorization_code');
    requestBody.append('client_id', process.env.TESLA_CLIENT_ID ?? "");
    requestBody.append('client_secret', process.env.TESLA_CLIENT_SECRET ?? "");
    requestBody.append('code', code);
    requestBody.append('audience', 'https://fleet-api.prd.na.vn.cloud.tesla.com');
    requestBody.append('redirect_uri', process.env.REDIRECT_URI ?? "");

    try {
        const response = await axios.post('https://auth.tesla.com/oauth2/v3/token',
            requestBody.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

        const { access_token, refresh_token } = response.data;
        console.log(response.data);
        const tesla = new Tesla(access_token);
        const me = await tesla.getMe();
        const database = makeDatabaseInstance();
        const meDb = await database.findUser({ email: me.email });
        if (meDb) {
            console.log("New access token:", access_token);
            await database.updateAccessToken(me.email, access_token);
            console.log(`User ${meDb.email} is logged in!`);
            users.push(meDb);
            return;
        }
        const products = await tesla.getProducts();
        const vins = products.map(product => (product as CarProduct).vin).filter(p => p);
        const solarProduct = products.find<SolarProduct>(((product: any) => product.energy_site_id !== undefined) as any);
        if (!solarProduct) {
            console.error("Could not find solar panels"); // TODO: handle errors better my man
            return;
        }
        const siteId = solarProduct.energy_site_id;
        if (!meDb) {
            const createUserPayload = {
                email: me.email,
                access_token,
                refresh_token,
                carsVins: vins,
                siteId,
                serviceEnabled: true
            };
            console.log("Creating user", createUserPayload);
            await database.createUser(createUserPayload);
        } else {
            console.log(meDb);
        }
        
      } catch (error: any) {
        const data = error.data;
        if (data) {
            console.error('Error:', data);
        } else {
            console.error(error);
        }
      }
}

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);

    const users = await makeDatabaseInstance().getAllUsers();
    
    for (const user of users) {
        const tesla = new Tesla(user.access_token, user._id);
        const loop = new ThrottleLoop(tesla, user);
        loop.throttleCar();
        setInterval(() => loop.throttleCar(), 30000);
    }
});