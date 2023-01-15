import { Activity } from "../../../shared/model/activity";
import { getInbox } from "../handler/ap/api";
import { signedFetcher } from "../handler/ap/signedFetcher";

export const newDeliveryClient = (signKey: {
  privateKeyPemString: string;
  keyId: string;
}) => {
  return {
    deliveryActivity: async (to: string, activity: Activity) => {
      const { data: inbox, error: inboxError } = await getInbox(to);
      if (!inbox) {
        return { error: inboxError };
      }

      return await signedFetcher(signKey, inbox, {
        method: "post",
        body: activity,
      });
    },
  };
};

export type DeliveryClient = ReturnType<typeof newDeliveryClient>;
