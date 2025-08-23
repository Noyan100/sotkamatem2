import { Navigation } from "@/components/navigation";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tasks");
  return (
    <div>
      <Navigation />
    </div>
  );
}
