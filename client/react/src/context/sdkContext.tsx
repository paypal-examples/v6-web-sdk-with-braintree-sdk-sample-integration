import React, { useState, useEffect, createContext } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { client as braintreeClient, paypalCheckout } from 'braintree-web';
import type { PayPalCheckout } from 'braintree-web';

import type {
  Component,
  CreateInstanceOptions,
  PageType,
  PayPalInstance,
} from '../types/paypal';

async function initPayPalAndBraintreeSdk({
  clientToken,
  components,
  pageType,
}: CreateInstanceOptions) {
  const paypalInstance = await window.paypal.createInstance({
    clientToken: clientToken!,
    components,
    pageType,
  });

  const braintreeInstance = await braintreeClient.create({
    authorization: clientToken!,
  });

  const braintreePayPalCheckout = await paypalCheckout.create({
    client: braintreeInstance,
  });

  return {
    paypalInstance,
    braintreePayPalCheckout,
  };
}

interface PayPalSDKContextProps {
  paypalInstance: PayPalInstance | null;
  braintreePayPalCheckout: PayPalCheckout | null;
}

const initialContext: PayPalSDKContextProps = {
  paypalInstance: null,
  braintreePayPalCheckout: null,
};

interface PayPalSDKProviderProps {
  components: Component[];
  children: React.ReactNode;
  pageType: PageType;
  clientToken?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PayPalSDKContext =
  createContext<PayPalSDKContextProps>(initialContext);

export const PayPalSDKProvider: React.FC<PayPalSDKProviderProps> = ({
  clientToken,
  components,
  children,
  pageType,
}) => {
  const { showBoundary } = useErrorBoundary();
  const [paypalInstance, setPayPalInstance] = useState<PayPalInstance | null>(
    null
  );
  const [braintreePayPalCheckout, setBraintreePayPalCheckout] =
    useState<PayPalCheckout | null>(null);

  useEffect(() => {
    const loadPayPalSDK = async () => {
      if (!paypalInstance && clientToken) {
        try {
          const result = await initPayPalAndBraintreeSdk({
            clientToken,
            components,
            pageType,
          });
          setPayPalInstance(result.paypalInstance);
          setBraintreePayPalCheckout(result.braintreePayPalCheckout);
        } catch (error) {
          showBoundary(error);
        }
      }
    };

    loadPayPalSDK();
  }, [clientToken]);

  return (
    <PayPalSDKContext.Provider
      value={{
        paypalInstance,
        braintreePayPalCheckout,
      }}
    >
      {children}
    </PayPalSDKContext.Provider>
  );
};
