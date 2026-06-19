declare module 'netrc' {
  function netrc(file?: string): Record<string, any>
  namespace netrc {
    function format(obj: Record<string, any>): string
  }
  export = netrc
}
