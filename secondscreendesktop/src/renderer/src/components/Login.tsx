import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const emailRegex = /^[^\s@]+@[^\s@]+\.(com|edu)$/

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Invalid email')
    .regex(emailRegex, 'Email must contain @ and end with .com or .edu'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login(): React.ReactNode {
  useEffect(() => {
    supabase.auth.getSession().then((data) => console.log('current session', data))
  }, [])
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    const email = data.email
    const password = data.password
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error)
    if (authData) console.log(authData)
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-sm bg-slate-800 border border-slate-700 shadow-xl text-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Login to your account</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Email */}
            <div className="grid gap-2">
              <Label>Email</Label>

              <Input
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
              />

              {errors.email && <p className="text-rose-400 text-sm">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label>Password</Label>

              <Input
                type="password"
                placeholder="********"
                {...register('password')}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500"
              />

              {errors.password && (
                <p className="text-rose-400 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Login
            </Button>

            {/* Google Button */}
            <Button
              variant="outline"
              className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Login with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
