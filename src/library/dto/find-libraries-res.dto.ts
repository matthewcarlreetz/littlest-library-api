import { Library, LibraryContent } from '@prisma/client';

export type FindLibrariesResDto = Library &
  Partial<Omit<LibraryContent, 'id'>> & {
    distanceInMiles: number;
  };
