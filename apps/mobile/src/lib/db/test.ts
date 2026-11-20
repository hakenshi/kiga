import { EmotionRepository } from "@/repositories/emotion-repository";

async function main() {

  const emotions = await EmotionRepository.findMany(1)
  console.log(emotions)
}

main().then().catch(e => console.error(e))
