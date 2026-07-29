import { BirthDataForm } from "@/components/BirthDataForm";

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="font-display text-3xl text-starlight-lilac">Birth data</h1>
      <p className="mt-2 max-w-md text-center text-sm text-celestial-silver">
        Add your birth details to unlock your natal chart and weave it into future readings.
      </p>
      <div className="mt-10 w-full max-w-md">
        <BirthDataForm />
      </div>
    </main>
  );
}
