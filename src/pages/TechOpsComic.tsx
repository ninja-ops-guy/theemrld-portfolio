import { Navigate, useSearchParams } from 'react-router-dom';
import LatestComicReader from './LatestComicReader';

/** Only the current books are public. Historical page numbers are not interchangeable. */
export default function TechOpsComic() {
  const [params] = useSearchParams();
  const edition = params.get('edition');
  const current = edition === 'g' || edition === 'xiii-r' || edition === 'xiv';
  if (current || (!edition && !params.has('page'))) return <LatestComicReader />;

  // Retired editions go to the correct current book, not to an unrelated old page number.
  const destination = edition === 'xiii' ? 'xiii-r' : 'g';
  const query = new URLSearchParams({ edition: destination });
  if (params.get('from') === 'world') query.set('from', 'world');
  return <Navigate replace to={{ pathname: '/comic', search: `?${query}` }} />;
}
