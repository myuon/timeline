import { NoteRepository } from "../infra/noteRepository";

export interface App {
  noteRepository: NoteRepository;
}
