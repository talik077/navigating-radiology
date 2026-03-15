import { getCourseIndex } from "@/lib/data";
import HomeContent from "./HomeContent";

export default function Home() {
  const index = getCourseIndex();
  return <HomeContent courseTypes={index.courseTypes} />;
}
