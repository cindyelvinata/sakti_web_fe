import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import emailIcon from '@/assets/images/email_icons.svg'
import keyIcon from '@/assets/images/key_icons.svg'
import eyeOpenIcon from '@/assets/images/eye1_icons.svg'
import eyeClosedIcon from '@/assets/images/eye2_icons.svg'
import loginIllustration from '@/assets/images/login_icons.svg'
import { login } from '@/services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setErrorMessage('')
    setIsLoading(true)

    try {
      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      })
      navigate(ROUTES.dashboard)
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Login gagal. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white p-5 sm:p-8">
      <section className="grid w-full max-w-[1130px] overflow-hidden rounded-2xl border border-slate-200 bg-[#FCFDFE] shadow-[0_5px_16px_rgba(15,23,42,.22)] lg:grid-cols-2">
        <div className="flex min-h-[500px] items-center justify-center px-7 py-12 sm:px-16 lg:min-h-[650px] lg:border-r-2 lg:border-slate-200">
          <form className="w-full max-w-[365px]" onSubmit={handleSubmit}>
            <h1 className="text-center text-[36px] font-bold leading-none text-black">Masuk</h1>
            <p className="mx-auto mt-4 max-w-[325px] text-center text-[14px] leading-5 text-slate-600">
              Masukkan email dan password Anda untuk mengakses layanan dengan aman
            </p>

            <div className="mt-12 space-y-4">
              <label className="relative flex h-[54px] items-center rounded-full border border-[#B7DFE9] bg-[#EDF9FC] px-7">
                <img src={emailIcon} alt="" className="h-[18px] w-[22px] shrink-0 object-contain" />
                <input
                  name="email"
                  className="ml-4 w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-500"
                  type="email"
                  placeholder="Alamat email"
                  required
                  disabled={isLoading}
                />
              </label>

              <label className="relative flex h-[54px] items-center rounded-full border border-[#B7DFE9] bg-[#EDF9FC] px-7">
                <img src={keyIcon} alt="" className="h-[21px] w-[18px] shrink-0 object-contain" />
                <input
                  name="password"
                  className="ml-4 w-full bg-transparent pr-8 text-[13px] text-slate-800 outline-none placeholder:text-slate-500"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-7"
                  disabled={isLoading}
                >
                  <img
                    src={showPassword ? eyeClosedIcon : eyeOpenIcon}
                    alt=""
                    className="h-[18px] w-[22px] object-contain"
                  />
                </button>
              </label>
            </div>

            {errorMessage && (
              <p role="alert" className="mt-3 text-center text-[13px] text-[#EF2427]">
                {errorMessage}
              </p>
            )}

            <button
              className="mt-14 h-[53px] w-full rounded-full bg-[#EF2427] text-[14px] font-semibold text-white transition hover:bg-[#d91c1f] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <div className="hidden min-h-[650px] items-center justify-center bg-white p-10 lg:flex">
          <img
            src={loginIllustration}
            alt="Ilustrasi masuk ke aplikasi"
            className="h-auto w-full max-w-[470px] object-contain"
          />
        </div>
      </section>
    </main>
  )
}
