import { supabase } from '@/lib/supabase'
import { User } from '@/model/User'

export async function getUser(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', id)
    .single()
  if (data) {
    console.log(data)
    return new User({
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name
    })
  }
  if (error) return null
  return null
}
