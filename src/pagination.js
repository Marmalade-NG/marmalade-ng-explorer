const TOKENS_PER_PAGE = 20

const no_zero = x => x?x:1;
const no_more = (x, max) => x>max?max:x;
const clamp_page = (x, max) => no_more(no_zero(x), max)

function paginate(x, page)
{
    const total_pages = no_zero(Math.ceil(x.length / TOKENS_PER_PAGE));
    const current_page = clamp_page(page, total_pages)
    const selected = x.slice( (current_page-1)*TOKENS_PER_PAGE, current_page*TOKENS_PER_PAGE)
    return {total_pages, current_page, selected};
}

export {paginate}
