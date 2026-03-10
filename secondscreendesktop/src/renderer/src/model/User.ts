export class User {
  id: string
  email: string
  first_name: string
  last_name: string

  constructor({
    id,
    email,
    first_name,
    last_name
  }: {
    id: string
    email: string
    first_name: string
    last_name: string
  }) {
    this.id = id
    this.email = email
    this.first_name = first_name
    this.last_name = last_name
  }
}
