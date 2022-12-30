export interface FollowRequest {
  "@context": string;
  summary: string;
  type: "Follow";
  actor: {
    type: "Person";
    name: string;
  };
  object: {
    type: "Person";
    name: string;
  };
}
