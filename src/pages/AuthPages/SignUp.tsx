import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Campus App | Registro"
        description="Página de registro de Campus App"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
