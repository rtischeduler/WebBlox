
;; ===== f131791 (calls the connect import) =====
  (func (;131791;) (type 0) (param i32)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i64 f64 v128 exnref)
    global.get 0
    i32.const 160
    i32.sub
    local.tee 2
    global.set 0
    block ;; label = @1
      block (result i32) ;; label = @2
        local.get 0
        i32.load8_u offset=864
        i32.const 1
        i32.eq
        if ;; label = @3
          i32.const 0
          local.get 0
          i64.atomic.load offset=872
          f64.reinterpret_i64
          f64.const 0x1.fffffffffffffp+1023 (;=179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000;)
          f64.ne
          br_if 1 (;@2;)
          drop
          local.get 0
          call 157633
          i64.reinterpret_f64
          i64.atomic.store offset=872
          i32.const 1
          br 1 (;@2;)
        end
        i32.const 0
        local.get 0
        i32.load8_u offset=896
        br_if 0 (;@2;)
        drop
        call 157633
        local.set 24
        local.get 0
        i32.load8_u offset=896
        i32.eqz
        if ;; label = @3
          local.get 0
          i32.const 1
          i32.store8 offset=896
        end
        local.get 0
        local.get 24
        f64.store offset=888
        i32.const 1
      end
      i32.eqz
      br_if 0 (;@1;)
      local.get 0
      call 131602
      local.set 1
      block ;; label = @2
        i32.const 8191404
        i32.load8_u
        i32.const 1
        i32.eq
        if ;; label = @3
          local.get 1
          i32.atomic.load offset=29924
          br_if 1 (;@2;)
        end
        local.get 1
        i32.const 0
        i32.const 1
        i32.atomic.rmw.cmpxchg offset=29924
        br_if 0 (;@2;)
        local.get 1
        i32.const 29408
        i32.add
        i32.const 1
        call 132006
      end
      block ;; label = @2
        i32.const 8190996
        i32.load8_u
        i32.const 1
        i32.ne
        br_if 0 (;@2;)
        local.get 1
        i64.load offset=30992
        i64.const 0
        i64.ne
        br_if 0 (;@2;)
        i32.const 20587832
        i32.load
        i32.const 20587839
        i32.load8_s
        local.tee 5
        local.get 5
        i32.const 0
        i32.lt_s
        local.tee 5
        select
        i32.eqz
        br_if 0 (;@2;)
        i32.const 20587828
        i32.load
        i32.const 20587828
        local.get 5
        select
        i32.const 0
        i32.const 10
        call 163452
        local.tee 23
        i64.const 0
        i64.le_s
        br_if 0 (;@2;)
        local.get 1
        local.get 23
        i64.store offset=30992
      end
      block ;; label = @2
        block ;; label = @3
          local.get 0
          call 131502
          i32.load8_u offset=120
          i32.const 1
          i32.eq
          if ;; label = @4
            local.get 0
            call 131502
            local.tee 1
            i32.load offset=112
            local.get 1
            i32.load8_s offset=119
            local.tee 1
            local.get 1
            i32.const 0
            i32.lt_s
            select
            br_if 1 (;@3;)
          end
          i32.const 1265198   ;; '[WASM-RNA] RtcIoWasmClientConnection::start missing gameFqdn'
          i32.const 0
          call 163158
          local.get 2
          i32.const 64
          call 166572
          local.tee 1
          i32.store offset=4
          local.get 2
          i32.const 14
          i32.store
          local.get 1
          i32.const 1265196
          i32.load8_u
          i32.store8 offset=56
          local.get 1
          i32.const 1265188
          i64.load align=1
          i64.store offset=48 align=1
          local.get 1
          i32.const 1265172
          v128.load align=1
          v128.store offset=32 align=1
          local.get 1
          i32.const 1265156
          v128.load align=1
          v128.store offset=16 align=1
          local.get 1
          i32.const 1265140   ;; 'WASM WebTransport requires ConnectConfiguration::gameFqdn'
          v128.load align=1
          v128.store align=1
          local.get 2
          i32.const 57
          i32.store offset=8
          local.get 1
          i32.const 0
          i32.store8 offset=57
          local.get 2
          i32.const -2147483584
          i32.store offset=12
          block (result exnref) ;; label = @4
            try_table (catch_all_ref 0 (;@4;)) ;; label = @5
              local.get 2
              i32.const 136
              i32.add
              local.get 2
              call 131933
              local.get 2
              local.get 2
              i32.load offset=152
              i32.store offset=128
              local.get 2
              local.get 2
              v128.load offset=136 align=8
              v128.store offset=112 align=8
              local.get 2
              i64.const 0
              i64.store offset=144
              local.get 2
              i32.const 0
              i32.store offset=152
              local.get 2
              i32.const 1
              i32.store8 offset=132
              block (result exnref) ;; label = @6
                try_table (catch_all_ref 0 (;@6;)) ;; label = @7
                  local.get 0
                  local.get 2
                  i32.const 112
                  i32.add
                  call 131786
                  br 5 (;@2;)
                end
                unreachable
              end
              local.get 2
              global.set 0
              block ;; label = @6
                local.get 2
                i32.load8_u offset=132
                i32.const 1
                i32.ne
                br_if 0 (;@6;)
                local.get 2
                i32.load8_s offset=131
                i32.const 0
                i32.ge_s
                br_if 0 (;@6;)
                local.get 2
                i32.load offset=128
                drop
                local.get 2
                i32.load offset=120
                call 166574
              end
              local.get 2
              i32.load8_s offset=155
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 2
                i32.load offset=152
                drop
                local.get 2
                i32.load offset=144
                call 166574
              end
              throw_ref
            end
            unreachable
          end
          local.get 2
          global.set 0
          local.get 2
          i32.load8_s offset=15
          i32.const 0
          i32.lt_s
          if ;; label = @4
            local.get 2
            i32.load offset=12
            drop
            local.get 2
            i32.load offset=4
            call 166574
          end
          throw_ref
        end
        local.get 0
        call 131502
        local.set 1
        local.get 2
        i32.const 8
        i32.store8 offset=27
        local.get 2
        i64.const 3400000511170344040
        i64.store offset=16
        local.get 1
        i32.load offset=112
        local.set 6
        local.get 1
        i32.load offset=108
        local.set 7
        local.get 1
        i32.load8_s offset=119
        local.set 5
        local.get 2
        i32.const 0
        i32.store8 offset=24
        block ;; label = @3
          block (result exnref) ;; label = @4
            try_table (catch_all_ref 0 (;@4;)) ;; label = @5
              local.get 2
              i32.const 16
              i32.add
              local.tee 4
              local.get 7
              local.get 1
              i32.const 108
              i32.add
              local.get 5
              i32.const 0
              i32.lt_s
              local.tee 7
              select
              local.get 6
              local.get 5
              local.get 7
              select
              call 164255
              drop
              local.get 4
              i32.const 58
              call 164258
              local.get 2
              i32.const 136
              i32.add
              local.tee 5
              local.get 1
              i32.load16_u offset=20
              call 164289
              block ;; label = @6
                block (result exnref) ;; label = @7
                  try_table (catch_all_ref 0 (;@7;)) ;; label = @8
                    local.get 4
                    local.get 2
                    i32.load offset=136
                    local.get 5
                    local.get 2
                    i32.load8_s offset=147
                    local.tee 5
                    i32.const 0
                    i32.lt_s
                    local.tee 4
                    select
                    local.get 2
                    i32.load offset=140
                    local.get 5
                    local.get 4
                    select
                    call 164255
                    drop
                    br 2 (;@6;)
                  end
                  unreachable
                end
                local.get 2
                global.set 0
                local.get 2
                i32.load8_s offset=147
                i32.const 0
                i32.lt_s
                if ;; label = @7
                  local.get 2
                  i32.load offset=144
                  drop
                  local.get 2
                  i32.load offset=136
                  call 166574
                end
                throw_ref
              end
              local.get 2
              i32.load8_s offset=147
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 2
                i32.load offset=144
                drop
                local.get 2
                i32.load offset=136
                call 166574
              end
              local.get 2
              i64.const 0
              i64.store
              local.get 2
              local.get 1
              i64.atomic.load offset=48
              i64.atomic.store
              local.get 2
              i32.const 136
              i32.add
              local.set 5
              global.get 0
              i32.const -64
              i32.add
              local.tee 1
              global.set 0
              local.get 1
              i64.const 0
              i64.store offset=8
              local.get 1
              local.get 2
              i64.atomic.load
              i64.atomic.store offset=8
              local.get 1
              i32.const 36
              i32.add
              local.get 1
              i32.const 8
              i32.add
              call 131930
              local.get 5
              i32.const 0
              i32.store8 offset=4
              local.get 5
              i32.const 4
              i32.store8 offset=11
              local.get 5
              i32.const 1064597295
              i32.store
              local.get 1
              i32.const 18
              i32.store offset=4
              local.get 1
              i32.const 6341264   ;; 'X-Rbx-Capabilities'
              i32.store
              local.get 1
              local.get 1
              i64.load align=4
              i64.store offset=16
              block ;; label = @6
                block (result exnref) ;; label = @7
                  try_table (catch_all_ref 0 (;@7;)) ;; label = @8
                    local.get 1
                    i32.const 24
                    i32.add
                    local.tee 4
                    local.get 1
                    i32.const 16
                    i32.add
                    call 153716
                    block ;; label = @9
                      block (result exnref) ;; label = @10
                        try_table (catch_all_ref 0 (;@10;)) ;; label = @11
                          local.get 5
                          local.get 1
                          i32.load offset=24
                          local.get 4
                          local.get 1
                          i32.load8_s offset=35
                          local.tee 4
                          i32.const 0
                          i32.lt_s
                          local.tee 6
                          select
                          local.get 1
                          i32.load offset=28
                          local.get 4
                          local.get 6
                          select
                          call 164255
                          drop
                          br 2 (;@9;)
                        end
                        unreachable
                      end
                      local.get 1
                      global.set 0
                      local.get 1
                      i32.load8_s offset=35
                      i32.const 0
                      i32.lt_s
                      if ;; label = @10
                        local.get 1
                        i32.load offset=32
                        drop
                        local.get 1
                        i32.load offset=24
                        call 166574
                      end
                      throw_ref
                    end
                    local.get 1
                    i32.load8_s offset=35
                    i32.const 0
                    i32.lt_s
                    if ;; label = @9
                      local.get 1
                      i32.load offset=32
                      drop
                      local.get 1
                      i32.load offset=24
                      call 166574
                    end
                    local.get 5
                    i32.const 61
                    call 164258
                    local.get 1
                    local.get 1
                    i32.load offset=40
                    local.get 1
                    i32.load8_s offset=47
                    local.tee 4
                    local.get 4
                    i32.const 0
                    i32.lt_s
                    local.tee 4
                    select
                    i32.store offset=60
                    local.get 1
                    local.get 1
                    i32.load offset=36
                    local.get 1
                    i32.const 36
                    i32.add
                    local.get 4
                    select
                    i32.store offset=56
                    local.get 1
                    local.get 1
                    i64.load offset=56 align=4
                    i64.store offset=48
                    local.get 1
                    i32.const 24
                    i32.add
                    local.tee 4
                    local.get 1
                    i32.const 48
                    i32.add
                    call 153716
                    block (result exnref) ;; label = @9
                      try_table (catch_all_ref 0 (;@9;)) ;; label = @10
                        local.get 5
                        local.get 1
                        i32.load offset=24
                        local.get 4
                        local.get 1
                        i32.load8_s offset=35
                        local.tee 4
                        i32.const 0
                        i32.lt_s
                        local.tee 6
                        select
                        local.get 1
                        i32.load offset=28
                        local.get 4
                        local.get 6
                        select
                        call 164255
                        drop
                        br 4 (;@6;)
                      end
                      unreachable
                    end
                    local.get 1
                    global.set 0
                    local.get 1
                    i32.load8_s offset=35
                    i32.const 0
                    i32.lt_s
                    if ;; label = @9
                      local.get 1
                      i32.load offset=32
                      drop
                      local.get 1
                      i32.load offset=24
                      call 166574
                    end
                    throw_ref
                  end
                  unreachable
                end
                local.get 1
                global.set 0
                local.get 5
                i32.load8_s offset=11
                i32.const 0
                i32.lt_s
                if ;; label = @7
                  local.get 5
                  i32.load offset=8
                  drop
                  local.get 5
                  i32.load
                  call 166574
                end
                local.get 1
                i32.load8_s offset=47
                i32.const 0
                i32.lt_s
                if ;; label = @7
                  local.get 1
                  i32.load offset=44
                  drop
                  local.get 1
                  i32.load offset=36
                  call 166574
                end
                throw_ref
              end
              local.get 1
              i32.load8_s offset=35
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 1
                i32.load offset=32
                drop
                local.get 1
                i32.load offset=24
                call 166574
              end
              local.get 1
              i32.load8_s offset=47
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 1
                i32.load offset=44
                drop
                local.get 1
                i32.load offset=36
                call 166574
              end
              local.get 1
              i32.const -64
              i32.sub
              global.set 0
              block ;; label = @6
                block (result exnref) ;; label = @7
                  try_table (catch_all_ref 0 (;@7;)) ;; label = @8
                    local.get 2
                    i32.const 16
                    i32.add
                    local.get 2
                    i32.load offset=136
                    local.get 5
                    local.get 2
                    i32.load8_s offset=147
                    local.tee 1
                    i32.const 0
                    i32.lt_s
                    local.tee 5
                    select
                    local.get 2
                    i32.load offset=140
                    local.get 1
                    local.get 5
                    select
                    call 164255
                    drop
                    br 2 (;@6;)
                  end
                  unreachable
                end
                local.get 2
                global.set 0
                local.get 2
                i32.load8_s offset=147
                i32.const 0
                i32.lt_s
                if ;; label = @7
                  local.get 2
                  i32.load offset=144
                  drop
                  local.get 2
                  i32.load offset=136
                  call 166574
                end
                throw_ref
              end
              local.get 2
              i32.load8_s offset=147
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 2
                i32.load offset=144
                drop
                local.get 2
                i32.load offset=136
                call 166574
              end
              i32.const 8189572
              i32.load8_u
              i32.const 1
              i32.ne
              br_if 2 (;@3;)
              local.get 2
              i32.const 16
              i32.add
              local.tee 1
              i32.const 38
              call 164258
              local.get 1
              i32.const 6343024   ;; 'X-Rbx-Close-Reason=utf8-v1'
              call 164254
              drop
              br 2 (;@3;)
            end
            unreachable
          end
          local.get 2
          global.set 0
          local.get 2
          i32.load8_s offset=27
          i32.const 0
          i32.lt_s
          if ;; label = @4
            local.get 2
            i32.load offset=24
            drop
            local.get 2
            i32.load offset=16
            call 166574
          end
          throw_ref
        end
        block ;; label = @3
          block (result exnref) ;; label = @4
            try_table (catch_all_ref 0 (;@4;)) ;; label = @5
              i32.const 8190072
              i64.load align=4
              local.tee 23
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 6
              i32.lt_u
              local.get 23
              i64.const 8
              i64.shr_u
              i32.wrap_i64
              i32.const 255
              i32.and
              i32.const 5
              i32.lt_u
              i32.or
              i32.eqz
              if ;; label = @6
                local.get 2
                local.get 23
                i64.store offset=40
                local.get 2
                i32.const 92086   ;; '[DFLog::RbxTransportRnaExpConnection] Connecting WASM WebTransport to {}'
                i32.store offset=48
                local.get 2
                i32.const 72
                i32.store offset=52
                local.get 2
                i64.const 13
                i64.store offset=136
                local.get 2
                local.get 2
                i32.load offset=20
                local.get 2
                i32.load8_s offset=27
                local.tee 1
                local.get 1
                i32.const 0
                i32.lt_s
                local.tee 1
                select
                i32.store offset=4
                local.get 2
                local.get 2
                i32.load offset=16
                local.get 2
                i32.const 16
                i32.add
                local.get 1
                select
                i32.store
                local.get 2
                local.get 2
                i32.store offset=144
                local.get 2
                local.get 2
                i64.load offset=40
                i64.store offset=88
                local.get 2
                local.get 2
                i64.load offset=48 align=4
                i64.store offset=32
                local.get 2
                local.get 2
                v128.load offset=136 align=8
                v128.store offset=96 align=8
                local.get 2
                i32.const 88
                i32.add
                i32.const 5
                local.get 2
                i32.const 32
                i32.add
                local.get 2
                i32.const 96
                i32.add
                i32.const 1
                call 157492
              end
              local.get 2
              local.get 2
              i32.load offset=24
              i32.store offset=80
              local.get 2
              local.get 2
              i64.load offset=16
              i64.store offset=72
              local.get 0
              i32.load offset=34320
              local.set 5
              local.get 2
              i64.const 0
              i64.store offset=16
              local.get 2
              i32.const 0
              i32.store offset=24
              local.get 2
              local.get 0
              i32.store offset=56
              local.get 2
              i32.const 6343122
              i32.store offset=68
              block (result exnref) ;; label = @6
                try_table (catch_all_ref 0 (;@6;)) ;; label = @7
                  local.get 2
                  i32.const 72
                  i32.add
                  local.set 16
                  global.get 0
                  i32.const 160
                  i32.sub
                  local.tee 3
                  global.set 0
                  local.get 3
                  i32.const 23931556
                  i32.load
                  i32.store offset=156
                  block ;; label = @8
                    local.get 2
                    i32.const 56
                    i32.add
                    local.tee 0
                    local.get 5
                    i32.const 2097312
                    i32.add
                    local.tee 1
                    i32.eq
                    br_if 0 (;@8;)
                    block ;; label = @9
                      local.get 5
                      i32.load offset=2097324
                      local.tee 4
                      i32.const 8
                      i32.lt_u
                      br_if 0 (;@9;)
                      local.get 4
                      i32.const 2
                      i32.and
                      local.set 6
                      local.get 4
                      i32.const 4
                      i32.and
                      if ;; label = @10
                        local.get 1
                        local.get 1
                        i32.load
                        local.get 6
                        select
                        local.get 4
                        i32.const -8
                        i32.and
                        i32.load offset=8
                        call_indirect (type 0)
                      end
                      local.get 6
                      br_if 0 (;@9;)
                      block ;; label = @10
                        try_table (catch_all 0 (;@10;)) ;; label = @11
                          local.get 1
                          i32.load
                          call 157398
                          br 2 (;@9;)
                        end
                        unreachable
                      end
                      local.get 3
                      global.set 0
                      call 164531
                      unreachable
                    end
                    local.get 5
                    i32.const 0
                    i32.store offset=2097324
                    local.get 5
                    local.get 0
                    i32.load offset=12
                    local.tee 4
                    i32.store offset=2097324
                    local.get 4
                    i32.const 8
                    i32.lt_u
                    br_if 0 (;@8;)
                    block ;; label = @9
                      local.get 4
                      i32.const 2
                      i32.and
                      i32.eqz
                      if ;; label = @10
                        local.get 1
                        local.get 0
                        i32.load offset=8
                        i32.store offset=8
                        local.get 1
                        local.get 0
                        i64.load align=4
                        i64.store
                        br 1 (;@9;)
                      end
                      local.get 4
                      i32.const 4
                      i32.and
                      i32.eqz
                      if ;; label = @10
                        local.get 1
                        local.get 0
                        i32.load offset=8
                        i32.store offset=8
                        local.get 1
                        local.get 0
                        i64.load align=4
                        i64.store
                        br 1 (;@9;)
                      end
                      local.get 1
                      local.get 0
                      local.get 4
                      i32.const -8
                      i32.and
                      i32.load offset=4
                      call_indirect (type 1)
                      local.get 0
                      local.get 5
                      i32.load offset=2097324
                      i32.const -8
                      i32.and
                      i32.load offset=8
                      call_indirect (type 0)
                    end
                    local.get 0
                    i32.const 0
                    i32.store offset=12
                  end
                  block ;; label = @8
                    block ;; label = @9
                      call 89
                      i32.eqz
                      if ;; label = @10
                        i32.const 1922464   ;; '[WASM-RNA] WasmMultiplexedConnection::connect WebTransport unsupported'
                        i32.const 0
                        call 163158
                        i32.const 40
                        call 166572
                        local.set 0
                        local.get 3
                        i64.const -9223371865056083931
                        i64.store offset=80 align=4
                        local.get 3
                        local.get 0
                        i32.store offset=76
                        local.get 3
                        i32.const 15
                        i32.store offset=72
                        local.get 0
                        i32.const 1721070
                        i64.load align=1
                        i64.store offset=29 align=1
                        local.get 0
                        i32.const 1721057
                        v128.load align=1
                        v128.store offset=16 align=1
                        local.get 0
                        i32.const 1721041   ;; 'Browser WebTransport is not available'
                        v128.load align=1
                        v128.store align=1
                        local.get 0
                        i32.const 0
                        i32.store8 offset=37
                        block (result exnref) ;; label = @11
                          try_table (catch_all_ref 0 (;@11;)) ;; label = @12
                            local.get 3
                            i32.const 104
                            i32.add
                            local.get 3
                            i32.const 72
                            i32.add
                            call 131933
                            local.get 3
                            v128.load offset=104 align=8
                            local.set 25
                            local.get 3
                            i64.const 0
                            i64.store offset=112
                            local.get 3
                            i32.load offset=120
                            local.set 0
                            local.get 3
                            i32.const 0
                            i32.store offset=120
                            local.get 3
                            local.get 0
                            i32.store offset=48
                            local.get 3
                            local.get 25
                            v128.store offset=32 align=8
                            local.get 3
                            i32.const 1
                            i32.store8 offset=52
                            block (result exnref) ;; label = @13
                              try_table (catch_all_ref 0 (;@13;)) ;; label = @14
                                local.get 5
                                local.get 3
                                i32.const 32
                                i32.add
                                call 131718
                                br 5 (;@9;)
                              end
                              unreachable
                            end
                            local.get 3
                            global.set 0
                            block ;; label = @13
                              local.get 3
                              i32.load8_u offset=52
                              i32.const 1
                              i32.ne
                              br_if 0 (;@13;)
                              local.get 3
                              i32.load8_s offset=51
                              i32.const 0
                              i32.ge_s
                              br_if 0 (;@13;)
                              local.get 3
                              i32.load offset=48
                              drop
                              local.get 3
                              i32.load offset=40
                              call 166574
                            end
                            local.get 3
                            i32.load8_s offset=123
                            i32.const 0
                            i32.lt_s
                            if ;; label = @13
                              local.get 3
                              i32.load offset=120
                              drop
                              local.get 3
                              i32.load offset=112
                              call 166574
                            end
                            throw_ref
                          end
                          unreachable
                        end
                        local.get 3
                        global.set 0
                        local.get 3
                        i32.load8_s offset=87
                        i32.const 0
                        i32.lt_s
                        if ;; label = @11
                          local.get 3
                          i32.load offset=84
                          drop
                          local.get 3
                          i32.load offset=76
                          call 166574
                        end
                        throw_ref
                      end
                      local.get 5
                      i32.const 1
                      i32.store8 offset=104
                      local.get 3
                      i32.const 104
                      i32.add
                      local.get 5
                      i32.load offset=2097544
                      local.get 5
                      i32.load offset=2097548
                      local.get 5
                      i32.load offset=2097540
                      call 8513
                      local.set 8
                      block ;; label = @10
                        block (result exnref) ;; label = @11
                          try_table (catch_all_ref 0 (;@11;)) ;; label = @12
                            block ;; label = @13
                              i32.const 8190948
                              i32.load8_u
                              i32.const 1
                              i32.ne
                              br_if 0 (;@13;)
                              i32.const 20051436
                              i32.load
                              local.tee 4
                              i32.const 20051443
                              i32.load8_s
                              local.tee 1
                              local.get 1
                              i32.const 0
                              i32.lt_s
                              select
                              i32.eqz
                              br_if 0 (;@13;)
                              local.get 8
                              block (result i32) ;; label = @14
                                local.get 8
                                i32.load offset=36
                                local.tee 0
                                local.get 8
                                i32.load offset=40
                                i32.lt_u
                                if ;; label = @15
                                  block ;; label = @16
                                    local.get 1
                                    i32.const 0
                                    i32.ge_s
                                    if ;; label = @17
                                      local.get 0
                                      i32.const 20051440
                                      i32.load
                                      i32.store offset=8
                                      local.get 0
                                      i32.const 20051432
                                      i64.load align=4
                                      i64.store align=4
                                      br 1 (;@16;)
                                    end
                                    block (result exnref) ;; label = @17
                                      try_table (catch_all_ref 0 (;@17;)) ;; label = @18
                                        local.get 0
                                        i32.const 20051432
                                        i32.load
                                        local.get 4
                                        call 164270
                                        br 2 (;@16;)
                                      end
                                      unreachable
                                    end
                                    local.get 3
                                    global.set 0
                                    local.get 8
                                    local.get 0
                                    i32.store offset=36
                                    throw_ref
                                  end
                                  local.get 0
                                  i32.const 12
                                  i32.add
                                  br 1 (;@14;)
                                end
                                local.get 8
                                i32.const 32
                                i32.add
                                i32.const 20051432
                                call 34621
                              end
                              i32.store offset=36
                            end
                            call 158113
                            local.set 0
                            local.get 3
                            i32.const 0
                            i32.store offset=96
                            local.get 3
                            local.get 0
                            i32.store offset=84
                            local.get 3
                            i64.const 0
                            i64.store offset=88 align=4
                            local.get 3
                            i32.const 6342744
                            i32.store offset=72
                            local.get 3
                            local.get 3
                            i32.const 72
                            i32.add
                            local.tee 0
                            i32.store offset=100
                            block ;; label = @13
                              block ;; label = @14
                                try_table (catch_all 0 (;@14;)) ;; label = @15
                                  local.get 0
                                  i32.const 8
                                  i32.const 4
                                  call 158111
                                  local.set 7
                                  br 2 (;@13;)
                                end
                                unreachable
                              end
                              local.get 3
                              global.set 0
                              call 164531
                              unreachable
                            end
                            local.get 7
                            i32.const 8
                            i32.add
                            local.set 11
                            local.get 7
                            local.get 3
                            i32.load offset=88
                            local.tee 4
                            local.get 3
                            i32.load offset=92
                            local.tee 9
                            i32.sub
                            i32.add
                            local.set 6
                            block ;; label = @13
                              local.get 4
                              local.get 9
                              i32.eq
                              br_if 0 (;@13;)
                              local.get 4
                              local.set 0
                              local.get 6
                              local.set 1
                              block ;; label = @14
                                local.get 9
                                local.get 7
                                i32.sub
                                i32.const -16
                                i32.gt_u
                                br_if 0 (;@14;)
                                local.get 9
                                local.get 0
                                i32.sub
                                i32.const 4
                                i32.sub
                                local.tee 10
                                i32.const 28
                                i32.lt_u
                                br_if 0 (;@14;)
                                local.get 1
                                local.get 10
                                i32.const 2
                                i32.shr_u
                                i32.const 1
                                i32.add
                                local.tee 15
                                i32.const 2147483644
                                i32.and
                                local.tee 13
                                i32.const 2
                                i32.shl
                                local.tee 10
                                i32.add
                                local.set 1
                                local.get 0
                                local.get 10
                                i32.add
                                local.set 0
                                i32.const 0
                                local.set 10
                                loop ;; label = @15
                                  local.get 6
                                  local.get 10
                                  i32.const 2
                                  i32.shl
                                  local.tee 12
                                  i32.add
                                  local.get 4
                                  local.get 12
                                  i32.add
                                  v128.load align=4
                                  v128.store align=4
                                  local.get 10
                                  i32.const 4
                                  i32.add
                                  local.tee 10
                                  local.get 13
                                  i32.ne
                                  br_if 0 (;@15;)
                                end
                                local.get 13
                                local.get 15
                                i32.eq
                                br_if 1 (;@13;)
                              end
                              loop ;; label = @14
                                local.get 1
                                local.get 0
                                i32.load
                                i32.store
                                local.get 1
                                i32.const 4
                                i32.add
                                local.set 1
                                local.get 0
                                i32.const 4
                                i32.add
                                local.tee 0
                                local.get 9
                                i32.ne
                                br_if 0 (;@14;)
                              end
                            end
                            local.get 3
                            local.get 7
                            i32.store offset=92
                            local.get 3
                            local.get 6
                            i32.store offset=88
                            local.get 3
                            i32.load offset=96
                            local.set 0
                            local.get 3
                            local.get 11
                            i32.store offset=96
                            block ;; label = @13
                              local.get 4
                              i32.eqz
                              br_if 0 (;@13;)
                              block ;; label = @14
                                try_table (catch_all 0 (;@14;)) ;; label = @15
                                  local.get 3
                                  i32.const 72
                                  i32.add
                                  local.get 4
                                  local.get 0
                                  local.get 4
                                  i32.sub
                                  i32.const 4
                                  local.get 3
                                  i32.load offset=72
                                  i32.load offset=12
                                  call_indirect (type 6)
                                  br 2 (;@13;)
                                end
                                unreachable
                              end
                              local.get 3
                              global.set 0
                              call 164531
                              unreachable
                            end
                            local.get 3
                            i32.const 88
                            i32.add
                            local.set 19
                            local.get 8
                            i32.load offset=36
                            local.set 20
                            local.get 8
                            i32.load offset=32
                            local.set 0
                            loop ;; label = @13
                              local.get 3
                              block (result i32) ;; label = @14
                                block ;; label = @15
                                  block (result exnref) ;; label = @16
                                    try_table (catch_all_ref 0 (;@16;)) ;; label = @17
                                      local.get 0
                                      local.get 20
                                      i32.eq
                                      if ;; label = @18
                                        local.get 5
                                        i32.load offset=8
                                        local.get 16
                                        i32.load
                                        local.get 16
                                        local.get 16
                                        i32.load8_s offset=11
                                        i32.const 0
                                        i32.lt_s
                                        select
                                        local.get 3
                                        i32.load offset=88
                                        local.tee 0
                                        local.get 3
                                        i32.load offset=92
                                        local.get 0
                                        i32.sub
                                        i32.const 2
                                        i32.shr_s
                                        local.get 5
                                        i32.const 144
                                        i32.add
                                        local.get 5
                                        i32.const 136
                                        i32.add
                                        local.get 5
                                        i32.const 140
                                        i32.add
                                        i32.const 65536
                                        i32.const 32
                                        local.get 5
                                        i32.load8_u offset=105
                                        local.get 5
                                        i32.load8_u offset=106
                                        i32.const 8190256
                                        i32.load8_u
                                        call 90
                                        local.get 3
                                        i32.load offset=88
                                        local.tee 0
                                        i32.eqz
                                        br_if 8 (;@10;)
                                        local.get 3
                                        local.get 0
                                        i32.store offset=92
                                        block ;; label = @19
                                          try_table (catch_all 0 (;@19;)) ;; label = @20
                                            local.get 3
                                            i32.load offset=100
                                            local.tee 1
                                            local.get 0
                                            local.get 3
                                            i32.load offset=96
                                            local.get 0
                                            i32.sub
                                            i32.const 4
                                            local.get 1
                                            i32.load
                                            i32.load offset=12
                                            call_indirect (type 6)
                                            br 10 (;@10;)
                                          end
                                          unreachable
                                        end
                                        local.get 3
                                        global.set 0
                                        call 164531
                                        unreachable
                                      end
                                      local.get 3
                                      local.get 0
                                      local.get 0
                                      i32.load
                                      local.get 0
                                      i32.load8_s offset=11
                                      i32.const 0
                                      i32.ge_s
                                      select
                                      local.tee 4
                                      i32.store offset=68
                                      local.get 3
                                      local.get 3
                                      i32.load offset=92
                                      local.tee 1
                                      i32.store offset=28
                                      local.get 3
                                      i32.load offset=96
                                      local.set 6
                                      local.get 3
                                      local.get 19
                                      i32.store offset=64
                                      local.get 3
                                      local.get 3
                                      i32.const 68
                                      i32.add
                                      i32.store offset=60
                                      local.get 3
                                      local.get 3
                                      i32.const 28
                                      i32.add
                                      i32.store offset=56
                                      local.get 1
                                      local.get 6
                                      i32.lt_u
                                      if ;; label = @18
                                        local.get 1
                                        local.get 4
                                        i32.store
                                        local.get 1
                                        i32.const 4
                                        i32.add
                                        br 4 (;@14;)
                                      end
                                      global.get 0
                                      local.set 21
                                      block ;; label = @18
                                        local.get 3
                                        i32.const 56
                                        i32.add
                                        local.tee 15
                                        i32.load offset=8
                                        local.tee 9
                                        i32.load offset=4
                                        local.tee 17
                                        local.get 9
                                        i32.load
                                        local.tee 12
                                        i32.sub
                                        local.tee 4
                                        i32.const 2
                                        i32.shr_s
                                        i32.const 1
                                        i32.add
                                        local.tee 1
                                        i32.const 1073741824
                                        i32.lt_u
                                        if ;; label = @19
                                          local.get 15
                                          i32.load offset=4
                                          local.set 6
                                          local.get 9
                                          i32.load offset=12
                                          local.tee 13
                                          i32.const 1073741823
                                          local.get 9
                                          i32.load offset=8
                                          local.get 12
                                          i32.sub
                                          local.tee 7
                                          i32.const 1
                                          i32.shr_s
                                          local.tee 10
                                          local.get 1
                                          local.get 1
                                          local.get 10
                                          i32.lt_u
                                          select
                                          local.get 7
                                          i32.const 2147483643
                                          i32.gt_u
                                          select
                                          i32.const 2
                                          i32.shl
                                          local.tee 7
                                          i32.const 4
                                          local.get 13
                                          i32.load
                                          i32.load offset=8
                                          call_indirect (type 7)
                                          local.set 11
                                          local.get 9
                                          i32.load offset=4
                                          local.set 10
                                          local.get 9
                                          i32.load
                                          local.set 1
                                          local.get 4
                                          local.get 11
                                          i32.add
                                          local.tee 4
                                          local.get 6
                                          i32.load
                                          i32.store
                                          local.get 7
                                          local.get 11
                                          i32.add
                                          local.set 22
                                          local.get 4
                                          i32.const 4
                                          i32.add
                                          local.set 18
                                          local.get 4
                                          local.get 10
                                          local.get 1
                                          i32.sub
                                          local.tee 14
                                          i32.const -4
                                          i32.and
                                          i32.sub
                                          local.set 4
                                          block ;; label = @20
                                            local.get 1
                                            local.get 10
                                            i32.eq
                                            br_if 0 (;@20;)
                                            local.get 1
                                            local.set 6
                                            local.get 4
                                            local.set 7
                                            local.get 14
                                            i32.const 4
                                            i32.sub
                                            local.tee 14
                                            i32.const 44
                                            i32.lt_u
                                            local.get 10
                                            local.get 12
                                            i32.add
                                            local.get 11
                                            local.get 17
                                            i32.add
                                            i32.sub
                                            i32.const -16
                                            i32.gt_u
                                            i32.or
                                            i32.eqz
                                            if ;; label = @21
                                              local.get 4
                                              local.get 14
                                              i32.const 2
                                              i32.shr_u
                                              i32.const 1
                                              i32.add
                                              local.tee 17
                                              i32.const 2147483644
                                              i32.and
                                              local.tee 12
                                              i32.const 2
                                              i32.shl
                                              local.tee 6
                                              i32.add
                                              local.set 7
                                              local.get 1
                                              local.get 6
                                              i32.add
                                              local.set 6
                                              i32.const 0
                                              local.set 11
                                              loop ;; label = @22
                                                local.get 4
                                                local.get 11
                                                i32.const 2
                                                i32.shl
                                                local.tee 14
                                                i32.add
                                                local.get 1
                                                local.get 14
                                                i32.add
                                                v128.load align=4
                                                v128.store align=4
                                                local.get 11
                                                i32.const 4
                                                i32.add
                                                local.tee 11
                                                local.get 12
                                                i32.ne
                                                br_if 0 (;@22;)
                                              end
                                              local.get 12
                                              local.get 17
                                              i32.eq
                                              br_if 1 (;@20;)
                                            end
                                            loop ;; label = @21
                                              local.get 7
                                              local.get 6
                                              i32.load
                                              i32.store
                                              local.get 7
                                              i32.const 4
                                              i32.add
                                              local.set 7
                                              local.get 6
                                              i32.const 4
                                              i32.add
                                              local.tee 6
                                              local.get 10
                                              i32.ne
                                              br_if 0 (;@21;)
                                            end
                                          end
                                          local.get 9
                                          local.get 18
                                          i32.store offset=4
                                          local.get 9
                                          local.get 4
                                          i32.store
                                          local.get 9
                                          i32.load offset=8
                                          local.set 4
                                          local.get 9
                                          local.get 22
                                          i32.store offset=8
                                          local.get 1
                                          i32.eqz
                                          br_if 1 (;@18;)
                                          block ;; label = @20
                                            try_table (catch_all 0 (;@20;)) ;; label = @21
                                              local.get 13
                                              local.get 1
                                              local.get 4
                                              local.get 1
                                              i32.sub
                                              i32.const 4
                                              local.get 13
                                              i32.load
                                              i32.load offset=12
                                              call_indirect (type 6)
                                              br 3 (;@18;)
                                            end
                                            unreachable
                                          end
                                          local.get 21
                                          global.set 0
                                          call 164531
                                          unreachable
                                        end
                                        call 445
                                        unreachable
                                      end
                                      local.get 15
                                      i32.load
                                      local.get 18
                                      i32.store
                                      br 2 (;@15;)
                                    end
                                    unreachable
                                  end
                                  local.get 3
                                  global.set 0
                                  local.get 3
                                  i32.const 72
                                  i32.add
                                  call 4078
                                  drop
                                  throw_ref
                                end
                                local.get 3
                                i32.load offset=28
                              end
                              i32.store offset=92
                              local.get 0
                              i32.const 12
                              i32.add
                              local.set 0
                              br 0 (;@13;)
                            end
                            unreachable
                          end
                          unreachable
                        end
                        local.get 3
                        global.set 0
                        local.get 8
                        call 8515
                        drop
                        throw_ref
                      end
                      local.get 8
                      i32.load offset=32
                      local.tee 5
                      i32.eqz
                      br_if 1 (;@8;)
                      local.get 5
                      local.tee 1
                      local.get 8
                      i32.load offset=36
                      local.tee 0
                      i32.ne
                      if ;; label = @10
                        loop ;; label = @11
                          local.get 0
                          i32.const 12
                          i32.sub
                          local.set 1
                          local.get 0
                          i32.const 1
                          i32.sub
                          i32.load8_s
                          i32.const 0
                          i32.lt_s
                          if ;; label = @12
                            local.get 0
                            i32.const 4
                            i32.sub
                            i32.load
                            drop
                            local.get 1
                            i32.load
                            call 166574
                          end
                          local.get 5
                          local.get 1
                          local.tee 0
                          i32.ne
                          br_if 0 (;@11;)
                        end
                        local.get 8
                        i32.load offset=32
                        local.set 1
                      end
                      local.get 8
                      local.get 5
                      i32.store offset=36
                      block ;; label = @10
                        try_table (catch_all 0 (;@10;)) ;; label = @11
                          local.get 8
                          i32.load offset=44
                          local.tee 0
                          local.get 1
                          local.get 8
                          i32.load offset=40
                          local.get 1
                          i32.sub
                          i32.const 4
                          local.get 0
                          i32.load
                          i32.load offset=12
                          call_indirect (type 6)
                          br 3 (;@8;)
                        end
                        unreachable
                      end
                      local.get 3
                      global.set 0
                      call 164531
                      unreachable
                    end
                    block ;; label = @9
                      local.get 3
                      i32.load8_u offset=52
                      i32.const 1
                      i32.ne
                      br_if 0 (;@9;)
                      local.get 3
                      i32.load8_s offset=51
                      i32.const 0
                      i32.ge_s
                      br_if 0 (;@9;)
                      local.get 3
                      i32.load offset=48
                      drop
                      local.get 3
                      i32.load offset=40
                      call 166574
                    end
                    local.get 3
                    i32.load8_s offset=123
                    i32.const 0
                    i32.lt_s
                    if ;; label = @9
                      local.get 3
                      i32.load offset=120
                      drop
                      local.get 3
                      i32.load offset=112
                      call 166574
                    end
                    local.get 3
                    i32.load8_s offset=87
                    i32.const 0
                    i32.ge_s
                    br_if 0 (;@8;)
                    local.get 3
                    i32.load offset=84
                    drop
                    local.get 3
                    i32.load offset=76
                    call 166574
                  end
                  i32.const 23931556
                  i32.load
                  local.get 3
                  i32.load offset=156
                  i32.eq
                  if ;; label = @8
                    local.get 3
                    i32.const 160
                    i32.add
                    global.set 0
                    br 5 (;@3;)
                  end
                  unreachable
                end
                unreachable
              end
              local.get 2
              global.set 0
              local.get 2
              i32.const 56
              i32.add
              call 164725
              drop
              local.get 2
              i32.load8_s offset=83
              i32.const 0
              i32.lt_s
              if ;; label = @6
                local.get 2
                i32.load offset=80
                drop
                local.get 2
                i32.load offset=72
                call 166574
              end
              throw_ref
            end
            unreachable
          end
          local.get 2
          global.set 0
          local.get 2
          i32.load8_s offset=27
          i32.const 0
          i32.lt_s
          if ;; label = @4
            local.get 2
            i32.load offset=24
            drop
            local.get 2
            i32.load offset=16
            call 166574
          end
          throw_ref
        end
        block ;; label = @3
          local.get 2
          i32.load offset=68
          local.tee 0
          i32.const 8
          i32.lt_u
          br_if 0 (;@3;)
          local.get 0
          i32.const 2
          i32.and
          local.set 1
          local.get 0
          i32.const 4
          i32.and
          if ;; label = @4
            local.get 2
            i32.const 56
            i32.add
            local.get 2
            i32.load offset=56
            local.get 1
            select
            local.get 0
            i32.const -8
            i32.and
            i32.load offset=8
            call_indirect (type 0)
          end
          local.get 1
          br_if 0 (;@3;)
          block ;; label = @4
            try_table (catch_all 0 (;@4;)) ;; label = @5
              local.get 2
              i32.load offset=56
              call 157398
              br 2 (;@3;)
            end
            unreachable
          end
          local.get 2
          global.set 0
          call 164531
          unreachable
        end
        local.get 2
        i32.load8_s offset=83
        i32.const 0
        i32.lt_s
        if ;; label = @3
          local.get 2
          i32.load offset=80
          drop
          local.get 2
          i32.load offset=72
          call 166574
        end
        local.get 2
        i32.load8_s offset=27
        i32.const 0
        i32.ge_s
        br_if 1 (;@1;)
        local.get 2
        i32.load offset=24
        drop
        local.get 2
        i32.load offset=16
        call 166574
        br 1 (;@1;)
      end
      block ;; label = @2
        local.get 2
        i32.load8_u offset=132
        i32.const 1
        i32.ne
        br_if 0 (;@2;)
        local.get 2
        i32.load8_s offset=131
        i32.const 0
        i32.ge_s
        br_if 0 (;@2;)
        local.get 2
        i32.load offset=128
        drop
        local.get 2
        i32.load offset=120
        call 166574
      end
      local.get 2
      i32.load8_s offset=155
      i32.const 0
      i32.lt_s
      if ;; label = @2
        local.get 2
        i32.load offset=152
        drop
        local.get 2
        i32.load offset=144
        call 166574
      end
      local.get 2
      i32.load8_s offset=15
      i32.const 0
      i32.ge_s
      br_if 0 (;@1;)
      local.get 2
      i32.load offset=12
      drop
      local.get 2
      i32.load offset=4
      call 166574
    end
    local.get 2
    i32.const 160
    i32.add
    global.set 0
  )
