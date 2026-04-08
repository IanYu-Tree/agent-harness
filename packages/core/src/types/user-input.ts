export type UserInput = (TextInput | ImageInput)[];

export interface TextInput {
  type: 'text';
  text: string;
}

export interface ImageInput {
  type: 'image_url';
  imageUrl: { url: string };
}
