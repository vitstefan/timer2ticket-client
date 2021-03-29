export class Config {
  workspace?: Workspace | null;
  apiPoint?: string | null;
  defaultTimeEntryActivity?: DefaultTimeEntryActivity | null;
  userId?: number;
}

export class Workspace {
  id: string | number;
  name: string;

  constructor(id: string | number, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class DefaultTimeEntryActivity {
  id: string | number;
  name: string;

  constructor(id: string | number, name: string) {
    this.id = id;
    this.name = name;
  }
}