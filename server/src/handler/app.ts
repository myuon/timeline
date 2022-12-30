import { FollowRelationRepository } from "../infra/followRelationRepository";
import { NoteRepository } from "../infra/noteRepository";

export interface App {
  noteRepository: NoteRepository;
  followRelationRepository: FollowRelationRepository;
}
