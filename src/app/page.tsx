import { getCourseIndex } from "@/lib/db/queries";
import HomeContent from "./HomeContent";

export default async function Home() {
  const index = await getCourseIndex();
  return <HomeContent courseTypes={index.courseTypes} />;
}
