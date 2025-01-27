export type Profile = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  full_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
    };
  };
};