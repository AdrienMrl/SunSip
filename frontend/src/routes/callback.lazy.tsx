import { createLazyFileRoute, useLocation } from '@tanstack/react-router'
import { FormEvent, useEffect, useState } from 'react';

export const Route = createLazyFileRoute('/callback')({
  component: () => <CallbackPage />
})

const CallbackPage = () => {

    const [code, setCode] = useState<string | null>(null);
    const location = useLocation();
  
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const codeParam = params.get('code');
      setCode(codeParam);
    }, [location]);

    useEffect(() => {
        if (code === null) {
            return;
        }

        (async () => {
            await sendAuthRequest(code);
        })();
    }, [code]);

    return <div>Processing callback! {code}</div>
}

// http://localhost:5173/callback?code=NA_fd162bb1a6ee535633a8974c1a5c599fe84db71c29d7f62001890b047491&state=90f433ec-7fbe-438f-a05f-c0657d065a03&issuer=https%3A%2F%2Fauth.tesla.com%2Foauth2%2Fv3

const sendAuthRequest = async (authCode: string) => {
    const requestBody = {
      code: authCode,
    };

    try {
      const response = await fetch('http://localhost:3000/tesla-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
