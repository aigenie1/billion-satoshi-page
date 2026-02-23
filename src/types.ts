export interface Block {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  imageUrl: string;
  link: string;
  title: string;
  animated?: boolean;
}

export interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}
