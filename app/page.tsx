import Home from '@/components/ArchitectureHome';
import { readContent } from '@/lib/store';

export const dynamic = 'force-dynamic'; // изменения из админки видны сразу, без пересборки

export default async function Page() {
  return <Home content={await readContent()} />;
}
