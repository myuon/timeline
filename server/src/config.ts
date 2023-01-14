import { Actor } from "../../shared/model/actor";

export const domain = `tl.ramda.io`;
export const userName = "myuon";
export const userFirebaseId = "3MKscE4d0USAk8FiNVj2kJDdprd2";
export const userId = `${userName}@${domain}`;
export const userIdUrl = `https://${domain}/u/${userName}`;

export const userActor: Actor = {
  userId: userId,
  rawData: undefined,
  iconUrl:
    "https://pbs.twimg.com/profile_images/1398634166523097090/QhosMWKS_400x400.jpg",
  inboxUrl: `${userIdUrl}/inbox`,
  name: userName,
  summary: `${userName} @ ${domain}`,
  url: userIdUrl,
};
