import React from "react";
import { API, graphqlOperation } from "aws-amplify";
import { createOrder } from "../graphql/mutations";
import { getUser } from "../graphql/queries";
import StripeCheckout from "react-stripe-checkout";
import { Notification, Message } from "element-react";
import { history } from "../App";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_CN8uG9E9KDNxI7xVtdN1U5Be"
};

const PayButton = ({ product, userAttributes }) => {
  const getOwnerEmail = async ownerId => {
    try {
      const input = { id: ownerId };
      const result = await API.graphql(graphqlOperation(getUser, input));
      return result.data.getUser.email;
    } catch (err) {
      console.error(`Error fetching product owner's email`, err);
    }
  };

  const createShippingAddress = source => ({
    city: source.address_city,
    country: source.address_country,
    address_line1: source.address_line1,
    address_line2: source.address_line2,
    address_state: source.address_state,
    address_zip: source.address_zip
  });

  const handleCharge = async token => {
    try {
      // first get owner's current email to email them about purchase
      const ownerEmail = await getOwnerEmail(product.owner);
      console.log({ ownerEmail });
      // charge buyer
      const result = await API.post("orderlambda", "/charge", {
        body: {
          token,
          shipped: product.shipped,
          charge: {
            currency: stripeConfig.currency,
            amount: product.price,
            description: product.description
          },
          email: {
            customerEmail: userAttributes.email,
            ownerEmail
          }
        }
      });
      console.log({ result });
      if (result.charge.status === "succeeded") {
        let shippingAddress = null;
        if (product.shipped) {
          shippingAddress = createShippingAddress(result.charge.source);
        }
        // If charge was successful, associate the order data with User
        const input = {
          orderUserId: userAttributes.sub,
          orderProductId: product.id,
          shippingAddress
        };
        const order = await API.graphql(
          graphqlOperation(createOrder, { input })
        );
        console.log({ order });
        // Tell the user the order was successful
        Notification({
          title: "Success",
          message: `${result.message}`,
          type: "success",
          duration: 3000
        });
        // Return home and tell user they were sent an order email
        setTimeout(() => {
          history.push("/");
          Message({
            type: "info",
            message: "Check your verified email for order details",
            duration: 5000,
            showClose: true
          });
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      Notification.error({
        title: "Error",
        message: `${err.message || "Error processing order"}`
      });
    }
  };

  return (
    <StripeCheckout
      email={userAttributes.email}
      name={product.description}
      token={handleCharge}
      amount={product.price}
      currency={stripeConfig.currency}
      stripeKey={stripeConfig.publishableAPIKey}
      shippingAddress={product.shipped}
      billingAddress={product.shipped}
      locale="auto"
      allowRememberMe={false}
    />
  );
};

export default PayButton;
