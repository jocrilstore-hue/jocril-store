# Fix Thumbnail Click to Change Main Image

## Problem
Clicking on gallery thumbnails doesn't change the main product image displayed.

## Root Cause
The thumbnails have visual styling for interaction (`cursor-pointer`, hover effects) but no actual state management or click handlers to update the displayed image.

## Solution

### Changes to `components/product-detail.tsx`:

1. **Add state for selected image URL**
   - Track which image is currently displayed in the main viewer

2. **Include main image in thumbnail strip**
   - Show the primary image as first thumbnail so user can return to it

3. **Add onClick handlers to all thumbnails**
   - Clicking a thumbnail updates the selected image state

4. **Add visual indicator for currently selected thumbnail**
   - Highlight the active thumbnail with accent border (solid vs dashed)

## Checklist
- [x] Add `selectedImageUrl` state
- [x] Update main image to use selected state
- [x] Add main image as first thumbnail
- [x] Add onClick handlers to thumbnails
- [x] Add selected state styling to thumbnails

## Review

### Changes Made
- Added `selectedImageUrl` state initialized to `primaryImageUrl`
- Added `useEffect` to reset selected image when variant changes
- Created `allGalleryImages` array combining main image + gallery images
- Changed main display to use `selectedImageUrl` instead of `primaryImageUrl`
- Converted thumbnail divs to buttons with proper `onClick` handlers
- Added conditional styling: selected thumbnail gets solid accent border, others get dashed border with hover effect
- Thumbnails only show when there's more than 1 image

### Behavior
- Main image now appears as first thumbnail
- Clicking any thumbnail updates the main display
- Active thumbnail is visually highlighted
- Changing product variant resets to main image
