import * as u from '@virtuoso.dev/urx'
import { listStateSystem, buildListState } from './listStateSystem'
import { sizeSystem } from './sizeSystem'
import { propsReadySystem } from './propsReadySystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'

export const initialItemCountSystem = u.system(
  ([
    { sizes, firstItemIndex, data },
    { initialTopMostItemIndex },
    { listState },
    { didMount }
  ]) => {
    const initialItemCount = u.statefulStream(0)

    u.connect(
      u.pipe(
        didMount,
        u.withLatestFrom(initialItemCount),
        u.filter(([, count]) => count !== 0),
        u.withLatestFrom(initialTopMostItemIndex, sizes, firstItemIndex, data),
        u.map(([[, count], initialTopMostItemIndexValue, sizes, firstItemIndex, data = []]) => {
          let includedGroupsCount = 0
          if (sizes.groupIndices.length > 0) {
            for (const index of sizes.groupIndices) {
              if (index - includedGroupsCount >= count) {
                break
              }
              includedGroupsCount++
            }
          }

          const adjustedCount = count + includedGroupsCount
          const items = Array.from({ length: adjustedCount }).map((_, index) => ({ index, size: 0, offset: 0, data: data[initialTopMostItemIndexValue + index] }))
          return buildListState(items, [], adjustedCount, sizes, firstItemIndex)
        })
      ),
      listState
    )

    return { initialItemCount }
  },
  u.tup(sizeSystem, initialTopMostItemIndexSystem, listStateSystem, propsReadySystem),
  { singleton: true }
)
