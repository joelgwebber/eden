package res

import "io/ioutil"

// TODO: Use packed, memory-mapped resource files where possible.
//	mmap, err := gommap.Map(f.Fd(), gommap.PROT_READ, gommap.MapFlags(0))
//	if err != nil {
//		return nil, err
//	}
//	defer mmap.UnsafeUnmap()
func Load(name string) ([]byte, error) {
	return ioutil.ReadFile("res/" + name)
}
