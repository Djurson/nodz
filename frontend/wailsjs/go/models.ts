export namespace main {
	
	export class AppConfig {
	    baseDirectory: string;
	    externalRepos: string[];
	    editor: string;
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.baseDirectory = source["baseDirectory"];
	        this.externalRepos = source["externalRepos"];
	        this.editor = source["editor"];
	    }
	}

}

export namespace reposcan {
	
	export class Commits {
	
	
	    static createFrom(source: any = {}) {
	        return new Commits(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class FileEntry {
	    Path: string;
	    Size: number;
	    Language: string;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Size = source["Size"];
	        this.Language = source["Language"];
	    }
	}
	export class FolderNode {
	    Name: string;
	    Path: string;
	    Files: FileEntry[];
	    Children: FolderNode[];
	
	    static createFrom(source: any = {}) {
	        return new FolderNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Path = source["Path"];
	        this.Files = this.convertValues(source["Files"], FileEntry);
	        this.Children = this.convertValues(source["Children"], FolderNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DetailedRepository {
	    Path: string;
	    Tree: FolderNode;
	    Owner: string;
	    Name: string;
	    Commits: Commits[];
	
	    static createFrom(source: any = {}) {
	        return new DetailedRepository(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Tree = this.convertValues(source["Tree"], FolderNode);
	        this.Owner = source["Owner"];
	        this.Name = source["Name"];
	        this.Commits = this.convertValues(source["Commits"], Commits);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class LanguageStat {
	    Language: string;
	    Bytes: number;
	
	    static createFrom(source: any = {}) {
	        return new LanguageStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Language = source["Language"];
	        this.Bytes = source["Bytes"];
	    }
	}
	export class Repository {
	    Path: string;
	    FileCount: number;
	    Branch: string;
	    LastCommit: string;
	    LastCommitUnix: number;
	    LastCommitTitle: string;
	    Languages: LanguageStat[];
	    External: boolean;
	    Error: string;
	
	    static createFrom(source: any = {}) {
	        return new Repository(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.FileCount = source["FileCount"];
	        this.Branch = source["Branch"];
	        this.LastCommit = source["LastCommit"];
	        this.LastCommitUnix = source["LastCommitUnix"];
	        this.LastCommitTitle = source["LastCommitTitle"];
	        this.Languages = this.convertValues(source["Languages"], LanguageStat);
	        this.External = source["External"];
	        this.Error = source["Error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

