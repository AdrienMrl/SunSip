import { createLazyFileRoute } from '@tanstack/react-router'
import '../App.css'
import env from '../../env.json';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

export const Route = createLazyFileRoute('/')({
  component: () => <App />
})

function App() {

  const randomUUID = uuidv4();

  const teslaAPI = {
    baseOAuthURL: 'https://auth.tesla.com/oauth2/v3',
    scopes: 'user_data openid vehicle_device_data vehicle_charging_cmds energy_device_data vehicle_cmds'
  }

  const teslaParams = new URLSearchParams({
    response_type: 'code',
    client_id: env.teslaClientId,
    redirect_uri: env.redirectURI,
    scope: teslaAPI.scopes,
    state: randomUUID,
  }).toString();

  const teslaAuthLink = `${teslaAPI.baseOAuthURL}/authorize?${teslaParams}`;

  return (
    <>
      <h1>Sunsip</h1>
      <div className="card">
        <a href={teslaAuthLink} target="_blank" rel="noopener noreferrer">
          Login With Tesla
        </a>
      </div>
    </>
  )
}
