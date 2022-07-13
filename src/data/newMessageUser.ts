/**
 * An interface that holds data for a user
 * to send a new message to
 */
export default interface NewMessageUser {
  //The user's display name
  name?: string;
  //The user's avatar image
  avatar?: string;
  //The normalized address
  address: string;
  //The display address
  displayAddress: string;
  //The address label
  addressLabel?: string;
}
