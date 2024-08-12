import { requestAuthCode } from "./tesla-http";

async function test() {
    await requestAuthCode();
}

test().then();