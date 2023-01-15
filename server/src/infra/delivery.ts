import { Activity } from "../../../shared/model/activity";
import { signedFetcher } from "../handler/ap/signedFetcher";

export const newDeliveryClient = (signKey: {
  privateKeyPemString: string;
  keyId: string;
}) => {
  return {
    deliveryActivity: async (inbox: string, activity: Activity) => {
      return await signedFetcher(signKey, inbox, {
        method: "post",
        body: activity,
      });
    },
  };
};

export type DeliveryClient = ReturnType<typeof newDeliveryClient>;
